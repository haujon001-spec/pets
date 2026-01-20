## Plan: Project Recap & Next Steps

Today's session covered a full deployment and troubleshooting cycle for your Next.js pet breed portal, including Docker, Caddy, DNS, GitHub, and LLM integration. Here's a summary and actionable plan for next time.

### What We Did Today
1. **Deployed Next.js app to a VPS** using Docker and Caddy for SSL.
2. **Configured DNS** for both root and www domains.
3. **Troubleshot 502 errors** (fixed by ensuring Next.js and Caddy ran correctly).
4. **Resolved Git/GitHub sync issues** (force push, commit, branch management).
5. **Tested LLM (OpenRouter) and image fallback** locally and on the VPS.
6. **Identified region-based LLM API restrictions** (403 error in HK, fixed with VPN).
7. **Discussed fallback logic and free LLM alternatives** for robust AI features.

### Outstanding Issues / To-Do List
1. **LLM API Not Working on VPS**
   - Investigate if VPS region is blocked by OpenRouter/Claude.
   - Test with VPN/proxy or try alternative LLM APIs (e.g., Hugging Face).
   - Ensure `.env` and API keys are present and correct on VPS.

2. **Pet Image Fallback Not Working on VPS**
   - Confirm fallback image exists in `public` and is included in Docker build.
   - Check image component's `onError` logic.
   - Ensure all assets are pushed to GitHub and deployed.

3. **General Deployment Sync**
   - Always push all changes (code, images, .env) to GitHub.
   - Pull latest on VPS, rebuild, and restart Docker container.

### Next Steps / How to Track in GitHub

#### 1. Create a New Branch for Fixes
```
git checkout -b fix/vps-llm-image-issues
git push origin fix/vps-llm-image-issues
```

#### 2. Create GitHub Issues
- Go to your repository on GitHub.
- Click on the "Issues" tab.
- Click "New Issue" and fill in the details for each outstanding problem.

**Example Issues:**
- "LLM API not working on VPS (region/network issue?)"
- "Pet image fallback not working in production"
- "Add fallback logic for multiple LLM providers"
- "Sync .env and assets between local and VPS"

#### 3. Assign Issues
- Assign issues to yourself or a team member.
- Optionally, use labels like `bug`, `enhancement`, `backend`, etc.

#### 4. Link Issues to Branch/PR
- When you push fixes to your branch, reference the issue number in your commit messages (e.g., `fix: #12 LLM fallback logic`).
- When ready, open a Pull Request from your branch to `main` and link the relevant issues.

---

### Further Considerations
- Consider using GitHub Projects or a Kanban board for better tracking.
- Document any region/network requirements for LLM APIs in your README.
- Use `.env.example` to help future deployments.

---

**When you return:**  
- Start by reviewing and updating the issues list.
- Work in the new branch to avoid breaking `main`.
- Tackle LLM and image fallback issues as top priorities.

Let me know if you want a template for GitHub issues or further automation for your workflow!