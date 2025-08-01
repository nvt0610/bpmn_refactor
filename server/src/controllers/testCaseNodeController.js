import testCaseNodeService from "../services/testCaseNodeService.js";

const testCaseNodeController = {
    getNodesByTestCaseId: async (req, res) => {
        const { testCaseId } = req.params;
        const result = await testCaseNodeService.getNodesByTestCaseId(testCaseId);
        res.status(result.status).json(result);
    },

    createNode: async (req, res) => {
        const result = await testCaseNodeService.createNode(req.body);
        res.status(result.status).json(result);
    },

    updateNode: async (req, res) => {
        const result = await testCaseNodeService.updateNode(req.body);
        res.status(result.status).json(result);
    },

    deleteNode: async (req, res) => {
        const result = await testCaseNodeService.deleteNode(req.body);
        res.status(result.status).json(result);
    },
    
    getAllTestCaseNodes: async (req, res) => {
        const { testCaseId, page, pageSize } = req.query;
        const result = await testCaseNodeService.getAllTestCaseNodes({ testCaseId, page, pageSize });
        res.status(result.status).json(result);
    },

};

export default testCaseNodeController;
