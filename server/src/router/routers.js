import roleRoutes from "./roleRoutes.js"; 
import userRoutes from "./userRoutes.js";
import testCaseRoutes from "./testCaseRoutes.js";
import extraDataRoutes from "./extraDataRoutes.js";
import n8nRoutes from "./n8nRoutes.js";
import testCaseNodeRoutes from "./testCaseNodeRoutes.js";

let initWebRouter = (app) => {
  roleRoutes(app);
  userRoutes(app);
  testCaseRoutes(app);
  extraDataRoutes(app);
  n8nRoutes(app);
  testCaseNodeRoutes(app);
};

export default initWebRouter;

