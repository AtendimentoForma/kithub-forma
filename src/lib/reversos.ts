import { queryOptions } from "@tanstack/react-query";
import { listarReversos } from "./reversos.functions";
export const reversosQuery = queryOptions({ queryKey: ["reversos"], queryFn: () => listarReversos() });
export type Reverso = Awaited<ReturnType<typeof listarReversos>>[number];
