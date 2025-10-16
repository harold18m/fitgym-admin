import ClientApp from "./ClientApp";

export default function CatchAll() {
  return <ClientApp />;
}

export function generateStaticParams() {
  return [
    { slug: ["asistencia"] },
    { slug: ["clientes"] },
    { slug: ["membresias"] },
    { slug: ["ejercicios"] },
    { slug: ["whatsapp"] },
    { slug: ["calendario"] },
    { slug: ["chatbot"] },
    { slug: ["configuracion"] },
    { slug: ["login"] },
    { slug: ["registro"] },
  ];
}