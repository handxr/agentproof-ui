import { Input } from "../input";

export default function WithError() {
  return <Input label="Email" type="email" name="email" defaultValue="juan@" error="Enter a full email address." />;
}
