import { Input } from "../input";

export default function Basic() {
  return <Input label="Email" type="email" name="email" autoComplete="email" hint="We only use it to reply." />;
}
