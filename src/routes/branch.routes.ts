import { Router } from "express";
import { BranchController } from "src/controllers/branch.controller";
import { branchUploads } from "src/config/branchUploads";
import { requireAdmin } from "src/middlewares/auth.middleware";

const branchRoutes = Router();

branchRoutes.get("/", BranchController.getAllBranches);
branchRoutes.get("/:id", BranchController.getOnebranch);
branchRoutes.post("/", requireAdmin, branchUploads.any(), BranchController.createBranch);
branchRoutes.patch("/:id", requireAdmin, branchUploads.any(), BranchController.editBranch);
branchRoutes.delete("/:id", requireAdmin, BranchController.deleteBranch);

export default branchRoutes;

/*
const fd = new FormData();
fd.append("title", "Branch 1");
fd.append("description", "Some description");

fd.append("services", JSON.stringify([
  { key: "s1", title_en: "Checkup", title_ru: "Осмотр", title_uz: "Ko‘rik", price: 100 },
  { key: "s2", title_en: "X-Ray", title_ru: "Рентген", title_uz: "Rentgen", price: 200 }
]));

fd.append("techs", JSON.stringify([
  { key: "t1", title: "MRI", description: "MRI device" },
  { key: "t2", title: "CT", description: "CT device" }
]));

fd.append("branch_media", file1);
fd.append("branch_media", file2);

fd.append("service_media__s1", svcFile1);
fd.append("service_media__s1", svcFile2);

fd.append("tech_media__t1", techFile1);

await fetch("/branches", { method: "POST", body: fd });
*/