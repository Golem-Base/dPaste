import styles from "./ErrorMessage.module.css";

interface Attrs {
  error: string;
  setError: (error: string) => void;
}

export default function ErrorMessage({ error, setError }: Attrs) {
  if (error) {
    return (
      <div className={styles.error} onClick={() => setError("")}>
        <svg
          aria-labelledby="errorIconTitle"
          color="#fff"
          fill="none"
          height="48px"
          role="img"
          stroke="#fff"
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeWidth="1"
          viewBox="0 0 24 24"
          width="48px"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title id="errorIconTitle" />
          <path d="M12 8L12 13" />
          <line x1="12" x2="12" y1="16" y2="16" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        <div><strong>Error:</strong> {error}</div>
      </div>
    );
  }
}
