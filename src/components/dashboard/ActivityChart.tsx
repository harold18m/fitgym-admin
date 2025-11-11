
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useEffect, useState } from "react";
import { authenticatedGet } from "@/lib/fetch-utils";

export function ActivityChart() {
  const labels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const [data, setData] = useState(labels.map((name) => ({ name, asistencias: 0 })));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeekly = async () => {
      try {
        setLoading(true);
        const weeklyData = await authenticatedGet<typeof data>('/api/dashboard/asistencias-semanales');
        setData(weeklyData);
      } catch (error) {
        console.error("Error cargando asistencias semanales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekly();
  }, []);

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Asistencias Semanales</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip />
            <CartesianGrid vertical={false} stroke="#f5f5f5" />
            <Bar dataKey="asistencias" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
