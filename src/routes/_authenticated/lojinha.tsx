import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getMyRole } from "@/lib/chamados";

export const Route = createFileRoute("/_authenticated/lojinha")({
  beforeLoad: async () => {
    const role = await getMyRole();
    if (role !== "lojinha" && role !== "admin") throw redirect({ to: role === "sac" ? "/sac" : "/" });
  },
  component: () => <Outlet />,
});
