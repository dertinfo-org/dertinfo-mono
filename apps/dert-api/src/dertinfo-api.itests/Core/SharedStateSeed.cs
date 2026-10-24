using System;
using System.Diagnostics;
using System.IO;

namespace DertInfo.Api.ITests.Core
{
    /// <summary>
    /// Applies tests/e2e/shared-state after the API has migrated. The pack stays in the end-to-end
    /// tree; these tests and the Playwright tests both read it from there.
    /// </summary>
    public static class SharedStateSeed
    {
        public static void ApplySystemBasic()
        {
            var repoRoot = RepoRoot.Find();
            var e2eDirectory = Path.Combine(repoRoot, "tests", "e2e");
            var script = Path.Combine(e2eDirectory, "shared-state", "apply.mjs");
            var mssql = Path.Combine(e2eDirectory, "node_modules", "mssql");
            if (!File.Exists(script))
            {
                throw new InvalidOperationException($"Shared-state script was not found: {script}");
            }

            if (!Directory.Exists(mssql))
            {
                throw new InvalidOperationException(
                    $"mssql is not installed at {mssql}. From tests/e2e run: npm install --ignore-scripts --no-package-lock");
            }

            var start = new ProcessStartInfo
            {
                FileName = "node",
                WorkingDirectory = e2eDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
            };
            start.ArgumentList.Add(script);
            start.ArgumentList.Add("system-basic");

            using var process = Process.Start(start);
            if (process == null)
            {
                throw new InvalidOperationException("Could not start node to apply shared-state.");
            }

            var stdout = process.StandardOutput.ReadToEnd();
            var stderr = process.StandardError.ReadToEnd();
            process.WaitForExit();
            if (process.ExitCode != 0)
            {
                throw new InvalidOperationException(
                    $"shared-state system-basic failed ({process.ExitCode}).{Environment.NewLine}{stdout}{Environment.NewLine}{stderr}");
            }
        }
    }
}
