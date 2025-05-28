import styles from "./Disclaimer.module.scss";
import { DOCUMENTATION_URL } from "@/lib/config";

export default function ErrorMessage() {
  return (
    <div className={styles.disclaimer}>
      <div>dPaste is a simple application showcasing Golem Base DB Chain storage capabilities. To create notes start with connecting the MetaMask browser plugin. Read more at <a style={{ color: "white" }} href={DOCUMENTATION_URL}>{DOCUMENTATION_URL}</a>. </div>
    </div>
  );
}
