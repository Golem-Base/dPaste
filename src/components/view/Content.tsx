import { useState } from "react";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { DATE_FORMAT_OPTIONS } from "@/lib/config";
import { GolemBaseRo } from "@/lib/golem-base";
import { Note } from "@/lib/note";
import styles from "@/styles/View.module.scss";
import form from "../add/Form.module.scss";
import { Input } from "@/components/ui/input";

export type State =
  | { type: "loading" }
  | { type: "encrypted"; note: Note }
  | { type: "success"; note: Note }
  | { type: "error" }
  | { type: "missing" };

interface Attrs {
  id: string;
  state: State;
  setState: (state: State) => void;
  setError: (error: string) => void;
}

export default function Content({ id, state, setState, setError }: Attrs) {
  const [password, setPassword] = useState("");
  const [expireDate, setExpireDate] = useState<Date | null>(null);

  async function decryptNote() {
    if (state.type !== "encrypted") {
      return;
    }
    try {
      await state.note.decrypt(password);
      console.debug("Note decrypted successfully!", state.note);
      setState({ type: "success", note: state.note });
    } catch (e) {
      console.error("Decryption error:", e);
      setError("Decrypting note failed.");
    }
  }
  switch (state.type) {
    case "loading":
      return (<div>Loading... </div>);
    case "missing":
      return (<p>Note {id} is missing</p>);
    case "error":
      return (<></>);
    case "encrypted":
      return (
        <div className={styles.note}>
          <p className={styles.note__date}>Created on {new Date(state.note.metadata["created-at"] * 1000).toLocaleDateString("en-US", DATE_FORMAT_OPTIONS)}</p>
          <h4>Note encrypted</h4>
          <label className={form.add__label}>
            Enter password:
          </label>
          <Input type="password" value={password} onChange={(ev) => setPassword(ev.target.value)} className={form.add__input} />
          <button className="button" onClick={decryptNote}>Decrypt</button>
        </div>
      );
    case "success": {
      if (state.note.payload.type === "encrypted") {
        throw Error("Note is encrypted");
      }

      GolemBaseRo.newRo().then((golemBase) => {
        if (expireDate == null && state.note.metadata["expiresAtBlock"] != null) {
          golemBase
            .estimateBlockDate(state.note.metadata["expiresAtBlock"])
            .then(setExpireDate)
            .catch((e) => console.error("Error getting expiration time:", e));
        }
      });

      return (
        <div className={styles.note}>
          <p className={styles.note__date}>Created on {new Date(Number(state.note.metadata["created-at"]) * 1000).toLocaleDateString("en-US", DATE_FORMAT_OPTIONS)}</p>
          {expireDate &&
            <p className={styles.note__date}>Estimated expiration date: {expireDate.toLocaleDateString("en-US", DATE_FORMAT_OPTIONS)}</p>}
          <CodeEditor
            id="editor"
            name="value"
            disabled={true}
            value={state.note.payload.text}
            placeholder="Empty note"
            padding={12}
            language={state.note.metadata["language"]}
            className={styles.note__details}
            style={{
              fontFamily: "monospace",
              fontSize: 14,
              backgroundColor: "#fff",
              borderRadius: 8,
              minHeight: "360px",
              maxHeight: "360px",
            }}
          />
        </div>
      );
    }
  }
}
