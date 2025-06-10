import styles from "./Disclaimer.module.scss";
import { DOCUMENTATION_URL } from "@/lib/config";

export default function DisclaimerMessage() {
  return (
    <div className={styles.disclaimer}>
      <div>dPaste is a simple application showcasing Golem Base DB Chain storage capabilities. To create notes start with connecting the MetaMask browser plugin. Read more at <a style={{ color: "white", textDecoration: "underline" }} href={DOCUMENTATION_URL}>GolemBase documentation</a>. </div>
    </div>
  );
}
