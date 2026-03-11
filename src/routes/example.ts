import { Router } from "express";
import { ZodError } from "zod";
import { exampleRepo, type IExampleRepo } from "../repo/example";
import { ExampleQuerySchema } from "../request/example";
import { sendProblem } from "../utils/problem";
import { zodErrorToFieldMap } from "../utils/validation";

export function createExampleRouter(deps: { repo: IExampleRepo }): Router {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const query = ExampleQuerySchema.parse({
        limit: req.query.limit,
      });

      const data = await deps.repo.listFromDb(query.limit);
      return res.status(200).json({ data });
    } catch (error) {
      if (error instanceof ZodError) {
        return sendProblem(req, res, {
          title: "Bad Request",
          status: 400,
          detail: "Invalid query parameters",
          errors: zodErrorToFieldMap(error),
        });
      }

      return next(error);
    }
  });

  return router;
}

// Composition root default router.
export const exampleRouter = createExampleRouter({ repo: exampleRepo });
