import {
  readRegister,
  readRegisterUrl,
  RegisterHeading,
  RegisterScreen,
} from '@/features/register';

// A server component: the register is read here and handed to the screen, together with
// what the address chose (period, register, KSeF view, search, `?state=empty|error`), so
// the first frame is already the chosen state; later reloads go through `GET /api/register`. The static
// page title renders here too, so the client bundle carries only what reacts to input.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const initial = readRegisterUrl(await searchParams);
  return (
    <RegisterScreen
      heading={<RegisterHeading />}
      initial={initial}
      // The error state renders from the first frame; its data is simply absent.
      snapshot={readRegister(initial.demo === 'error' ? 'empty' : (initial.demo ?? 'populated'))}
    />
  );
}
