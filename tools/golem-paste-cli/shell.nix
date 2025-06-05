{ pkgs ? import <nixpkgs>{} }:
pkgs.mkShell {
    buildInputs = with pkgs; [ gcc openssl pkg-config ];
}