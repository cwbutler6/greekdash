import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Join Chapter | GreekDash",
  description: "Join your fraternity or sorority chapter on GreekDash",
};

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
