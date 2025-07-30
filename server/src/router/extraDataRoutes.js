import express from "express";
import extraDataController from "../controllers/extraDataController.js";

const router = express.Router();

const extraDataRoutes = (app) => {
    router.get("/", extraDataController.getAllExtraData);
    router.get("/", extraDataController.getExtraData);
    router.post("/", extraDataController.createExtraData);
    router.put("/:id", extraDataController.updateExtraData);      // cần id để update
    router.delete("/:id", extraDataController.deleteExtraData);

    return app.use("/api/extradata", router);
};

export default extraDataRoutes;
