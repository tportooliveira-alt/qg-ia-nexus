const { Router } = require("express");

const router = Router();

router.use(require("./status.routes"));
router.use(require("./nexus.routes"));
router.use(require("./agent.routes"));
router.use(require("./memory.routes"));
router.use(require("./approval.routes"));
router.use(require("./fabrica.routes"));
router.use(require("./knowledge.routes"));
router.use(require("./terminal.routes"));
router.use(require("./fs.routes"));
router.use(require("./skills.routes"));
router.use(require("./config.routes"));
router.use(require("./mcp.routes"));
router.use(require("./audit.routes"));
router.use(require("./providers.routes"));
router.use("/docs", require("./document.routes"));
router.use(require("./activity.routes"));

module.exports = router;
