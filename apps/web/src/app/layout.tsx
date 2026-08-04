import AppShell from '../components/layout/AppShell';

export const metadata = {
  title: 'Neighbour™',
  description: 'Your local community platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
