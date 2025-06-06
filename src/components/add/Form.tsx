// import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { FEATURE_ENCRYPTION_ENABLED, BLOCK_INTERVAL, CHAIN_ID, MAX_NOTE_SIZE } from "@/lib/config";
import { Language, LANGUAGES } from "@/lib/language";
import { Note } from "@/lib/note";
import styles from "./Form.module.scss";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { GolemBaseRw } from "@/lib/golem-base";
import { setPending } from "@/lib/transactions";

// const CodeEditor = dynamic(
//   () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
//   { ssr: true }
// );
interface Attrs {
  setError: (error: string) => void;
  selectedWallet: EIP6963ProviderDetail | undefined;
  userAccount: string;
}

export default function Form({ setError, selectedWallet, userAccount }: Attrs) {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<Language>("plaintext");
  const [isFocused, setIsFocused] = useState(false);
  const [enableEncryption, setEnableEncryption] = useState(false);
  const [code, setCode] = useState("");

  const [isPending, enterPending] = useTransition();

  const addNote = async (data: FormData) => {
    try {
      const value = data.get("value");
      const ttls = data.get("ttl");
      const language = data.get("language") as string;
      const encrypted = data.get("encrypted") === "on";
      const password = data.get("password");

      console.debug("Form data:", { value, ttl: ttls, language, encrypted });
      if (typeof value !== "string" || typeof ttls !== "string") {
        console.error("Invalid form data:", { value, ttl: ttls, language, encrypted });
        throw new Error("Invalid form data");
      }
      if (value === "") {
        console.error("Cannot submit an empty note");
        throw new Error("Cannot submit an empty note");
      }

      const encodedLength = new TextEncoder().encode(value).length;
      if (encodedLength > MAX_NOTE_SIZE) {
        const msg = `Cannot submit note of length ${encodedLength}, maximum is ${MAX_NOTE_SIZE}`;
        console.error(msg);
        throw new Error(msg);
      }
      const ttl = Number(ttls) / BLOCK_INTERVAL;
      if (isNaN(ttl) || ttl <= 0) {
        console.error("Invalid form data:", { value, ttl: ttls, language, encrypted });
        throw new Error("Invalid form data");
      }
      let note;
      if (FEATURE_ENCRYPTION_ENABLED && encrypted) {
        if (typeof password !== "string" || password === "") {
          console.error("Invalid form data:", { value, ttl: ttls, language, encrypted });
          throw new Error("Invalid form data");
        }
        note = await Note.create({
          note: value,
          language,
          ttl,
          password,
        });
      } else {
        note = await Note.create({
          note: value,
          language,
          ttl,
          password: null,
        });
      }

      const wallet = selectedWallet;
      if (wallet == null) {
        console.error("No wallet selected");
        throw new Error("No wallet selected");
      }

      enterPending(async () => {
        try {
          const golemBase = await GolemBaseRw.newRw(wallet.provider);
          const noteId = await golemBase.createNote(note, {
            txHashCallback: (hash) => {
              setPending(userAccount, hash);
            },
          });
          console.debug("Created note:", noteId);
          router.push(`/view?id=${noteId}`);
        } catch (e) {
          console.error("Add note error:", e);
          const err =
            (e instanceof Error || (e instanceof Object && "message" in e)) &&
              typeof e.message === "string"
              ? e.message
              : JSON.stringify(e);
          setError(err);
        }
      });
    } catch (e) {
      console.error("Add note error:", e);
      const err =
        (e instanceof Error || (e instanceof Object && "message" in e)) &&
          typeof e.message === "string"
          ? e.message
          : JSON.stringify(e);
      setError(err);
    }
  }

  const walletSelected = selectedWallet !== undefined;
  let noteLenClass;
  if (code.length === 0) {
    noteLenClass = styles.lenLabel;
  } else if (code.length > MAX_NOTE_SIZE) {
    noteLenClass = `${styles.lenLabel} ${styles.lenLabel__error}`;
  } else {
    noteLenClass = styles.lenLabel;
  }

  const className = walletSelected ? styles.add__form : `${styles.add__form} ${styles.add__form_disabled}`;
  const pending = isPending;

  return (
    <form action={addNote}>
      <div className={className}>
        <CodeEditor
          suppressHydrationWarning={true}
          value={code}
          onChange={(evn) => setCode(evn.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          id="editor"
          name="value"
          placeholder="note here..."
          padding={12}
          language={currentLanguage}
          rows={10}
          style={{
            fontFamily: "monospace",
            fontSize: 14,
            backgroundColor: "#fff",
            borderRadius: 8,
            boxShadow: isFocused ? "0 0  30px rgba(255, 255, 255, 0.4)" : "none",
            minHeight: "300px",
            maxHeight: "300px",
            resize: "none",
            overflow: "auto",
          }}
        />
        <div className={noteLenClass}>
          {new TextEncoder().encode(code).length}/{MAX_NOTE_SIZE}
        </div>
        <div className={styles.add__form_footer}>
          <div className={styles.add__form_footer_row}>
            <label className={styles.add__label}>Expiration time (seconds):</label>
            <Input type="number" className={styles.add__input} id="ttl" name="ttl" defaultValue={86400} />
          </div>
          <div className={styles.add__form_footer_row}>
            <label className={styles.add__label}>
              Language:{" "}
            </label>
            <Select
              name="language"
              value={currentLanguage}
              onValueChange={(value: string) => setCurrentLanguage(value as Language)}
            >
              <SelectTrigger className={styles.add__select}>
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: "white" }}>
                {LANGUAGES.map((key, index) => (
                  <SelectItem key={index} value={key}>{key}</SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>
          {FEATURE_ENCRYPTION_ENABLED &&
            <div className={styles.add__form_footer_checkbox}>
              <Switch
                id="encrypted"
                name="encrypted"
                checked={enableEncryption}
                onCheckedChange={setEnableEncryption}
                className="data-[state=checked]:bg-primary bg-gray-100"
              />
              <label htmlFor="encrypted" className={styles.add__label}>Encrypt note</label>
            </div>}
          {FEATURE_ENCRYPTION_ENABLED && enableEncryption &&
            <div className={styles.add__form_footer_row}>
              <label className={styles.add__label}>Password:</label>
              <Input type="password" className={styles.add__input} id="password" name="password" />
            </div>}
          {submit({ pending, walletSelected })}
        </div>
        {isPending && <div className={styles.postingLabel}>We are posting your note, please wait</div>}
      </div>
    </form>
  );
}

function submit({ pending, walletSelected }: { pending: boolean, walletSelected: boolean }) {
  const disabled = pending || !walletSelected;

  let className;
  let buttonText;
  if (disabled) {
    if (pending) {
      className = "button button--submit button--loading";
      buttonText = "Adding...";
    } else {
      className = "button button--submit button--disabled";
      buttonText = "Add note";
    }
  } else {
    className = "button button--submit";
    buttonText = "Add note";
  }

  return (
    <button className={className} type="submit" disabled={disabled}>
      {buttonText}
    </button>
  );
}
