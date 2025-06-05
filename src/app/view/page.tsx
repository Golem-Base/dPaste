"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import ErrorMessage from "@/components/ErrorMessage";
import Content, { State } from "@/components/view/Content";
import { FEATURE_ENCRYPTION_ENABLED } from "@/lib/config";
import { Note } from "@/lib/note";
import styles from "@/styles/View.module.scss";

export default function View() {
  return (
    <>
      <Suspense>
        <NoteView />
      </Suspense>
      <Link href="/" className="button button--submit button-new">Create a new note!</Link>
    </>
  );
}

function NoteView() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [error, setError] = useState("");
  const [state, setState] = useState({ type: "loading" } as State);

  useEffect(() => {
    if (typeof id !== "string" || id === "") {
      console.error("Invalid note ID", id);
      setError("Invalid note ID");
      return;
    }
    Note.fetch(id)
      .then((note) => {
        if (note === null) {
          setState({ type: "missing" });
          return;
        }
        if (note.metadata["encrypted"]) {
          if (FEATURE_ENCRYPTION_ENABLED) {
            setState({ type: "encrypted", note });
          } else {
            setError("Encrypted notes not supported");
          }
        } else {
          setState({ type: "success", note });
        }
      })
      .catch((err) => {
        console.error("getEntity error:", err);

        switch (err.error?.code) {
          case -32000:
          case -32602:
            setError("Note expired or invalid ID provided");
            setState({ type: "missing" });
            return;
          default:
            setState({ type: "error" });
            setError(`Could not load note: ${id}`);
        }
      });

    console.debug("Note ID:", id);
  }, [id]);

  if (typeof id !== "string" || id === "") {
    console.error("Invalid note ID", id);
    setError("Invalid note ID");
    return;
  }

  return (
    <>
      <ErrorMessage error={error} setError={setError} />
      <div className={styles.view}>
        <div className={styles.note}>
          <p className={styles.note__title}>Note {id}</p>
        </div>
        <Content id={id} state={state} setState={setState} setError={setError} />
      </div>
    </>
  );
}
