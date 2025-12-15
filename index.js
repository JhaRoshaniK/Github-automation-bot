export default (app) => {
  app.on("issues.opened", async (context) => {
    const issue = context.payload.issue;
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;

    // Ignore bot-created issues
    if (issue.user.type === "Bot") {
      return;
    }

    // Avoid duplicate comments
    const comments = await context.octokit.issues.listComments({
      owner,
      repo,
      issue_number: issue.number,
    });

    const alreadyCommented = comments.data.some(
      (comment) =>
        comment.user.type === "Bot" &&
        comment.body.includes("Thanks for opening this issue")
    );

    if (alreadyCommented) {
      return;
    }

    // thank-you comment
    await context.octokit.issues.createComment({
      owner,
      repo,
      issue_number: issue.number,
      body: "👋 Thanks for opening this issue! We’ll look into it soon.",
    });

    // keyword-based labels
    const bodyText = `${issue.title} ${issue.body || ""}`.toLowerCase();
    const labels = [];

    if (bodyText.includes("bug")) labels.push("bug");
    if (bodyText.includes("feature")) labels.push("feature");
    if (bodyText.includes("documentation")) labels.push("documentation");

    if (labels.length > 0) {
      await context.octokit.issues.addLabels({
        owner,
        repo,
        issue_number: issue.number,
        labels,
      });
    }
  });
};
