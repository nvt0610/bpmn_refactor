import express from "express";
import testCaseNodeController from "../controllers/testCaseNodeController.js";

const router = express.Router();

const testCaseNodeRoutes = (app) => {
  router.get("/:testCaseId", testCaseNodeController.getNodesByTestCaseId);
  router.post("/", testCaseNodeController.createNode);
  router.delete("/", testCaseNodeController.deleteNode);
  router.put("/", testCaseNodeController.updateNode);

  return app.use("/api/test-case-nodes", router);
};

export default testCaseNodeRoutes;
