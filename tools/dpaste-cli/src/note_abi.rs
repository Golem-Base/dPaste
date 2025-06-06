use alloy::primitives::U256;
use alloy_rlp::{Encodable, RlpEncodable, RlpEncodableWrapper};

#[derive(Default, RlpEncodable)]
pub struct Data<'a>(
    pub Vec<Create<'a>>,
    pub Vec<Update<'a>>,
    pub Vec<Delete>,
    pub Vec<Extend>,
);

impl<'a> Data<'a> {
    pub fn with_create(mut self, create: Create<'a>) -> Self {
        self.0.push(create);
        self
    }

    pub fn with_update(mut self, update: Update<'a>) -> Self {
        self.1.push(update);
        self
    }

    pub fn with_delete(mut self, delete: Delete) -> Self {
        self.2.push(delete);
        self
    }

    pub fn with_extend(mut self, extend: Extend) -> Self {
        self.3.push(extend);
        self
    }

    pub fn rlp(self) -> Vec<u8> {
        let mut buf = Vec::new();
        self.encode(&mut buf);

        buf
    }
}

#[derive(RlpEncodable)]
pub struct Create<'a>(
    u64,
    &'a [u8],
    Vec<StringAnnotation<'a>>,
    Vec<NumericAnnotation<'a>>,
);

impl<'a> Create<'a> {
    pub fn new(ttl: u64, data: &'a [u8]) -> Self {
        Create(ttl, data, Vec::new(), Vec::new())
    }

    pub fn with_string_annotation(mut self, key: &'a str, value: &'a str) -> Self {
        self.2.push(StringAnnotation { key, value });
        self
    }

    pub fn with_numeric_annotation(mut self, key: &'a str, value: u64) -> Self {
        self.3.push(NumericAnnotation { key, value });
        self
    }
}

#[derive(RlpEncodable)]
pub struct Update<'a>(
    U256,
    u64,
    &'a [u8],
    Vec<StringAnnotation<'a>>,
    Vec<NumericAnnotation<'a>>,
);

impl<'a> Update<'a> {
    pub fn new(note_id: U256, ttl: u64, data: &'a [u8]) -> Self {
        Update(note_id, ttl, data, Vec::new(), Vec::new())
    }

    pub fn with_string_annotation(mut self, key: &'a str, value: &'a str) -> Self {
        self.3.push(StringAnnotation { key, value });
        self
    }

    pub fn with_numeric_annotation(mut self, key: &'a str, value: u64) -> Self {
        self.4.push(NumericAnnotation { key, value });
        self
    }
}

#[derive(RlpEncodableWrapper)]
pub struct Delete(pub U256);

#[derive(RlpEncodable)]
pub struct Extend(pub U256, pub u64);

#[derive(RlpEncodable)]
struct StringAnnotation<'a> {
    key: &'a str,
    value: &'a str,
}

#[derive(RlpEncodable)]
struct NumericAnnotation<'a> {
    key: &'a str,
    value: u64,
}
