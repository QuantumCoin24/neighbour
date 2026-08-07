import AppShell from '../components/layout/AppShell';

export const metadata = {
  title: 'Neighbour™ — Stronger together. Local forever.',

  description:
    'Connect with neighbours, discover what is happening nearby and build stronger local communities.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
        }}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
