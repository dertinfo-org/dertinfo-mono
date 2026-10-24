using Xunit;

// Each fixture starts the API, and Startup.Configure migrates the shared database.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
