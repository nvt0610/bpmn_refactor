import testCaseService from "../services/testCaseService.js";

const testCaseController = {
  getAllTestCases: async (req, res) => {
    const result = await testCaseService.getAllTestCases();
    res.status(result.status).json(result);
  },

  getTestCaseById: async (req, res) => {
    const result = await testCaseService.getTestCaseById(req.params); // { id }
    res.status(result.status).json(result);
  },

  createTestCase: async (req, res) => {
    const result = await testCaseService.createTestCase(req.body); // full payload
    res.status(result.status).json(result);
  },

  updateTestCase: async (req, res) => {
    const result = await testCaseService.updateTestCase({
      ...req.params, // id
      ...req.body,   // các field khác
    });
    res.status(result.status).json(result);
  },

  deleteTestCase: async (req, res) => {
    const result = await testCaseService.deleteTestCase(req.params); // { id }
    res.status(result.status).json(result);
  },
};

export default testCaseController;
