import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getMyRole } from "@/lib/chamados";

export const Route = createFileRoute("/_authenticated/sac")({
  beforeLoad: async () => {
    const role = await getMyRole();
    if (role !== "sac" && role !== "admin") throw redirect({ to: role === "lojinha" ? "/lojinha" : "/" });
  },
  component: () => <Outlet />,
});
