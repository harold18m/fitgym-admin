import { getMembresias } from "@/lib/data/membresias";
import { MembresiasContent } from "./MembresiasContent";

export default async function MembresiasPage() {
  const membresias = await getMembresias();

  return <MembresiasContent initialMembresias={membresias} />;
}
