import extraDataService from "../services/extraDataService.js";

const extraDataController = {
    getAllExtraData: async (req, res) => {
        const { page, pageSize } = req.query;
        const result = await extraDataService.getAllExtraData({ page, pageSize });
        res.status(result.status).json(result);
    },

    getExtraData: async (req, res) => {
        const result = await extraDataService.getExtraData(req.query);
        res.status(result.status).json(result);
    },

    createExtraData: async (req, res) => {
        const result = await extraDataService.createExtraData(req.body); // { testCaseId, nodeId, userId, roleId, data }
        res.status(result.status).json(result);
    },

    updateExtraData: async (req, res) => {
        const result = await extraDataService.updateExtraData({
            ...req.params, // id
            ...req.body,   // testCaseId, nodeId, userId, roleId, data
        });
        res.status(result.status).json(result);
    },

    deleteExtraData: async (req, res) => {
        const result = await extraDataService.deleteExtraData(req.params); // { testCaseId, nodeId, userId }
        res.status(result.status).json(result);
    },
    // Trong extraDataController.js bạn thêm hàm:
    getN8nNode: async (req, res) => {
        const result = await extraDataService.getN8nNode(req.params); // truyền { id }
        res.status(result.status).json(result);
    },

};

export default extraDataController;
