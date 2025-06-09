mod note_abi;

use aes_gcm::{Aes256Gcm, KeyInit, aead::Aead};
use alloy::{
    network::{Ethereum, TransactionBuilder},
    primitives::{Address, U256, address},
    providers::{Provider, ProviderBuilder},
    rpc::{client::ClientBuilder, types::TransactionInput},
    signers::local::PrivateKeySigner,
};
use clap::Parser;
use const_format::formatcp;
use note_abi::{Create, Data, Delete, Extend, Update};
use rand::{Rng, SeedableRng};
use rand_chacha::ChaCha20Rng;
use reqwest::Url;
use serde::Deserialize;

const APP_ID: &'static str = "f0cc72a1-62ba-48d7-bac4-e8a42da9da7e";
const KEY_APP_ID: &'static str = "app-id";
const DPASTE: &'static str = "io.golem-base.dpaste";
const KEY_CREATED_AT: &'static str = formatcp!("{DPASTE}.created-at");
const KEY_ENCRYPTED: &'static str = formatcp!("{DPASTE}.encrypted");
const KEY_LANGUAGE: &'static str = formatcp!("{DPASTE}.language");
const KEY_VERSION: &'static str = formatcp!("{DPASTE}.version");
const GOLEM_BASE_STORAGE_PROCESSOR_ADDRESS: Address =
    address!("0x0000000000000000000000000000000060138453");
const SALT: &'static str = "Golem Paste";
const CHAIN_ID: u64 = 600606;

#[derive(Parser)]
struct Args {
    #[command(subcommand)]
    action: Action,
    /// RPC Node URL
    #[arg(short, long, default_value = "http://localhost:8545")]
    node_url: Url,
}

#[derive(Parser)]
struct AddArgs {
    #[arg(short, long)]
    password: Option<String>,
    /// If omitted, read from STDIN
    note: Option<String>,
    /// Note TTL
    #[arg(default_value = "300")]
    ttl: u64,
    /// Note language
    #[arg(default_value = "plaintext")]
    language: String,
}

#[derive(Parser)]
struct UpdateArgs {
    note_id: U256,
    #[arg(short, long)]
    password: Option<String>,
    /// If omitted, read from STDIN
    note: Option<String>,
    /// Note TTL
    #[arg(default_value = "300")]
    ttl: u64,
    /// Note language
    #[arg(default_value = "plaintext")]
    language: String,
}

#[derive(Parser)]
struct DeleteArgs {
    note_id: U256,
}

#[derive(Parser)]
struct ExtendArgs {
    note_id: U256,
    #[arg(default_value = "300")]
    extend_by: u64,
}

#[derive(Parser)]
struct ViewArgs {
    note_id: String,
    /// Decryption password
    #[arg(short, long)]
    password: Option<String>,
    #[arg(short, long, action)]
    verbose: bool,
}

#[derive(Parser)]
enum Action {
    Add(AddArgs),
    Update(UpdateArgs),
    Delete(DeleteArgs),
    Extend(ExtendArgs),
    View(ViewArgs),
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct RpcMetadata {
    #[expect(dead_code)]
    expires_at_block: u64,
    #[expect(dead_code)]
    owner: String,
    numeric_annotations: Vec<Annotation<u64>>,
    string_annotations: Vec<Annotation<String>>,
}

#[derive(Deserialize, Debug)]
struct Annotation<T> {
    key: String,
    value: T,
}

#[derive(Debug)]
struct Metadata {
    #[expect(dead_code)]
    app_id: String,
    created_at: i64,
    encrypted: bool,
    language: String,
    version: String,
}

impl TryInto<Metadata> for RpcMetadata {
    type Error = ();

    fn try_into(self) -> Result<Metadata, Self::Error> {
        let string = |key| {
            self.string_annotations
                .iter()
                .find(|&x| x.key == key)
                .map(|x| x.value.clone())
                .unwrap()
        };
        let number = |key| {
            self.numeric_annotations
                .iter()
                .find(|&x| x.key == key)
                .map(|x| x.value.clone())
                .unwrap()
        };

        let app_id = string(KEY_APP_ID);
        let created_at = number(KEY_CREATED_AT) as i64;
        let encrypted = number(KEY_ENCRYPTED);
        let language = string(KEY_LANGUAGE);
        let version = string(KEY_VERSION);

        return Ok(Metadata {
            app_id,
            created_at,
            encrypted: encrypted == 1,
            language,
            version,
        });
    }
}
#[tokio::main(flavor = "current_thread")]
async fn main() {
    let args = Args::parse();
    match args.action {
        Action::Add(action) => {
            add_note(args.node_url, action).await;
        }
        Action::Update(action) => {
            update_note(args.node_url, action).await;
        }
        Action::Delete(action) => {
            delete_note(args.node_url, action).await;
        }
        Action::Extend(action) => {
            extend_note(args.node_url, action).await;
        }
        Action::View(action) => {
            view_note(args.node_url, action).await;
        }
    }
}

async fn add_note(node_url: Url, args: AddArgs) {
    let mut data = args.note.unwrap().as_bytes().to_vec();
    if let Some(password) = &args.password {
        data = encrypt(&data, password.as_bytes());
    }

    let buf = Data::default()
        .with_create(
            Create::new(args.ttl, &data)
                .with_string_annotation(KEY_APP_ID, APP_ID)
                .with_string_annotation(KEY_LANGUAGE, &args.language)
                .with_string_annotation(KEY_VERSION, "1.0.0")
                .with_numeric_annotation(KEY_CREATED_AT, chrono::Local::now().timestamp() as u64)
                .with_numeric_annotation(
                    KEY_ENCRYPTED,
                    if args.password.is_some() { 1 } else { 0 },
                ),
        )
        .rlp();

    let provider = get_private_key(node_url.as_str()).await;

    let tx = provider
        .transaction_request()
        .value(0.try_into().unwrap())
        .to(GOLEM_BASE_STORAGE_PROCESSOR_ADDRESS)
        .input(TransactionInput::new(buf.into()))
        .with_gas_limit(0xec58)
        .with_max_priority_fee_per_gas(0x3b9aca00)
        .with_max_fee_per_gas(0x2540be400);

    let result = provider.send_transaction(tx).await.unwrap();
    let receipt = result.get_receipt().await.unwrap();
    let note_id = receipt.logs()[0].topics()[1];
    println!("Paste submitted successfully.\nid: {note_id}");
}

async fn update_note(node_url: Url, args: UpdateArgs) {
    let mut data = args.note.unwrap().as_bytes().to_vec();
    if let Some(password) = &args.password {
        data = encrypt(&data, password.as_bytes());
    }

    let buf = Data::default()
        .with_update(
            Update::new(args.note_id, args.ttl, &data)
                .with_string_annotation(KEY_APP_ID, APP_ID)
                .with_string_annotation(KEY_LANGUAGE, &args.language)
                .with_string_annotation(KEY_VERSION, "1.0.0")
                .with_numeric_annotation(KEY_CREATED_AT, chrono::Local::now().timestamp() as u64)
                .with_numeric_annotation(
                    KEY_ENCRYPTED,
                    if args.password.is_some() { 1 } else { 0 },
                ),
        )
        .rlp();

    let provider = get_private_key(node_url.as_str()).await;

    let tx = provider
        .transaction_request()
        .value(0.try_into().unwrap())
        .to(GOLEM_BASE_STORAGE_PROCESSOR_ADDRESS)
        .input(TransactionInput::new(buf.into()))
        .with_gas_limit(0xec58)
        .with_max_priority_fee_per_gas(0x3b9aca00)
        .with_max_fee_per_gas(0x2540be400);

    let result = provider.send_transaction(tx).await.unwrap();
    let receipt = result.get_receipt().await.unwrap();
    let note_id = receipt.logs()[0].topics()[1];
    println!("Paste updated successfully.\nid: {note_id}");
}

async fn delete_note(node_url: Url, args: DeleteArgs) {
    let buf = Data::default().with_delete(Delete(args.note_id)).rlp();

    let provider = get_private_key(node_url.as_str()).await;

    let tx = provider
        .transaction_request()
        .value(0.try_into().unwrap())
        .to(GOLEM_BASE_STORAGE_PROCESSOR_ADDRESS)
        .input(TransactionInput::new(buf.into()))
        .with_gas_limit(0xec58)
        .with_max_priority_fee_per_gas(0x3b9aca00)
        .with_max_fee_per_gas(0x2540be400);

    let result = provider.send_transaction(tx).await.unwrap();
    let _receipt = result.get_receipt().await.unwrap();
    println!("Paste deleted successfully.");
}

async fn extend_note(node_url: Url, args: ExtendArgs) {
    let buf = Data::default()
        .with_extend(Extend(args.note_id, args.extend_by))
        .rlp();

    let provider = get_private_key(node_url.as_str()).await;

    let tx = provider
        .transaction_request()
        .value(0.try_into().unwrap())
        .to(GOLEM_BASE_STORAGE_PROCESSOR_ADDRESS)
        .input(TransactionInput::new(buf.into()))
        .with_gas_limit(0xec58)
        .with_max_priority_fee_per_gas(0x3b9aca00)
        .with_max_fee_per_gas(0x2540be400);

    let result = provider.send_transaction(tx).await.unwrap();
    let _receipt = result.get_receipt().await.unwrap();
    println!("Paste extended successfully.");
}

async fn get_private_key(node_url: &str) -> impl Provider<Ethereum> {
    let path = xdg::BaseDirectories::with_prefix("golembase").unwrap();
    let path = path.find_config_file("private.key").unwrap();
    let private_key = std::fs::read(path).unwrap();
    let signer = PrivateKeySigner::from_slice(&private_key).unwrap();

    ProviderBuilder::new()
        .wallet(signer.clone())
        .with_chain_id(CHAIN_ID)
        .connect(node_url)
        .await
        .unwrap()
}

fn derive_key(password: &[u8]) -> Vec<u8> {
    return pbkdf2::pbkdf2_hmac_array::<sha2::Sha256, 32>(password, SALT.as_bytes(), 1_000_000)
        .to_vec();
}

fn decrypt(data: &[u8], password: &[u8]) -> Result<Vec<u8>, aes_gcm::Error> {
    let iv = &data[0..12];
    let data = &data[12..];
    let cipher = Aes256Gcm::new_from_slice(&derive_key(password)).unwrap();
    return cipher.decrypt(iv.into(), data);
}

fn encrypt(data: &[u8], password: &[u8]) -> Vec<u8> {
    let mut rng = ChaCha20Rng::from_os_rng();
    let iv = rng.random::<[u8; 12]>();
    let cipher = Aes256Gcm::new_from_slice(&derive_key(password)).unwrap();
    let ciphertext = cipher.encrypt(&iv.into(), data).unwrap();

    return iv.into_iter().chain(ciphertext.into_iter()).collect();
}

async fn view_note(node_url: Url, args: ViewArgs) {
    use colored::Colorize;
    let client = ClientBuilder::default().http(node_url);
    let metadata: RpcMetadata = client
        .request("golembase_getEntityMetaData", [&args.note_id])
        .await
        .unwrap();
    let metadata: Metadata = metadata.try_into().unwrap();
    if args.verbose {
        let created_at = chrono::DateTime::from_timestamp(metadata.created_at, 0).unwrap();
        println!("");
        println!("{}: {}", "Note id".bold(), args.note_id);
        println!("{}: {}", "Created at".bold(), created_at);
        println!("{}: {}", "Syntax language".bold(), metadata.language);
        println!("{}: {}", "Paste protocol version".bold(), metadata.version);
        println!(
            "{}: {}",
            "Encrypted".bold(),
            if metadata.encrypted { "yes" } else { "no" }
        );

        println!("");
    }

    let data: String = client
        .request("golembase_getStorageValue", [&args.note_id])
        .await
        .unwrap();
    let mut data = data_encoding::BASE64.decode(data.as_bytes()).unwrap();
    if metadata.encrypted {
        match args.password {
            None => {
                println!(
                    "{}",
                    "Note is encrypted. Password must be provided."
                        .yellow()
                        .bold()
                );
                return;
            }
            Some(password) => match decrypt(&data, password.as_bytes()) {
                Ok(plaintext) => {
                    data = plaintext;
                }
                Err(_) => {
                    println!("{}", "Decryption error.".bold().red());
                    return;
                }
            },
        }
    }
    let data = String::from_utf8_lossy(&data).into_owned();

    println!("{data}");
}
