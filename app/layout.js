import "./globals.css";
export const metadata = { title: "Checklist de Empilhadeira", description: "Inspeção pré-operacional diária" };
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#F59E0B" };
export default function RootLayout({ children }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
