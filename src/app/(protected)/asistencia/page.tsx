import { getAsistenciasRecientes } from "@/lib/data/asistencias";
import { AsistenciaContent } from "./AsistenciaContent";

export default async function AsistenciaPage() {
  const asistencias = await getAsistenciasRecientes(100);

  return <AsistenciaContent initialAsistencias={asistencias} />;
}
