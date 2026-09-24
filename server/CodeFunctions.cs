using Elysian.Application.Exceptions;
using Elysian.Application.Features.Code.Commands;
using Elysian.Application.Features.Code.Models;
using Elysian.Application.Features.Code.Queries;
using Elysian.Application.Interfaces;
using Elysian.Domain.Constants;
using Elysian.Domain.Security;
using Elysian.Infrastructure.Context;
using ElysianFunctions.Middleware;
using MediatR;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace ElysianFunctions
{
    public class CodeFunctions(IConfiguration configuration, IGitHubService gitHubService,
        IClaimsPrincipalAccessor claimsPrincipalAccessor, ElysianContext context,
        IMediator mediator)
    {
        [Function("GitHubAuthMe")]
        public async Task<HttpResponseData> GitHubAuthMe([HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequestData req)
        {
            var oAuthToken = await mediator.Send(new GetGitHubAccessTokenQuery());

            return await req.WriteJsonResponseAsync(new
            {
                HasGitHubOAuthToken = !string.IsNullOrWhiteSpace(oAuthToken?.AccessToken)
            });
        }

        [Function("GitHubSearch")]
        public async Task<HttpResponseData> GitHubSearch([HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequestData req)
        {
            var term = req.Query["term"];

            var result = await mediator.Send(new SearchCodeQuery(term));

            return await req.WriteJsonResponseAsync(result);
        }


        [Function("GitHubRepoContents")]
        public async Task<HttpResponseData> GitHubRepoContents([HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequestData req)
        {
            var path = req.Query["path"];
            var repo = req.Query["repo"];

            var result = await mediator.Send(new GetFileContentQuery(repo, path));

            return await req.WriteHtmlResponseAsync(result.Html);
        }

        [Function("GitHubOAuthUrl")]
        public async Task<HttpResponseData> GetGitHubOAuthUrl([HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequestData req)
        {
            var oAuthUrl = await mediator.Send(new CreateGitHubOAuthUrlCommand());

            return await req.WriteJsonResponseAsync(new
            {
                oAuthUrl = oAuthUrl.url
            });
        }

        [Function("GitHubOAuthCallback")]
        public async Task<HttpResponseData> GitHubOAuthCallback([HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequestData req)
        {
            var accessTokenRequest = await req.DeserializeBodyAsync<GitHubAccessTokenRequest>();
            var oAuthToken = await mediator.Send(new CreateGitHubAccessTokenCommand(accessTokenRequest));

            return await req.WriteJsonResponseAsync(new
            {
                HasGitHubOAuthToken = !string.IsNullOrWhiteSpace(oAuthToken?.AccessToken)
            });
        }

        [Function("CodeGeneration")]
        public async Task<HttpResponseData> GenerateCode([HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequestData req)
        {
            var generateCodeRequest = await req.DeserializeBodyAsync<CodeGenerationRequest>();

            var codeGenerationResponse = await mediator.Send(new GenerateCodeCommand(generateCodeRequest));

            return await req.WriteJsonResponseAsync(new
            {
                code = codeGenerationResponse.Code
            });
        }
    }
}
