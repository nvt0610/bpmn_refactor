import express from "express";
import extraDataController from "../controllers/extraDataController.js";

const router = express.Router();

const extraDataRoutes = (app) => {
    router.get("/all", extraDataController.getAllExtraData);
    router.get("/", extraDataController.getExtraData);
    router.post("/", extraDataController.createExtraData);
    router.put("/:id", extraDataController.updateExtraData);      // cần id để update
    router.delete("/:id", extraDataController.deleteExtraData);

    router.get("/:id/n8n-node", extraDataController.getN8nNode);

    return app.use("/api/extradata", router);
};

export default extraDataRoutes;
