using Elysian.Application.Exceptions;
using Finbuckle.MultiTenant;
using Finbuckle.MultiTenant.Abstractions;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.Functions.Worker.Middleware;
using Microsoft.Extensions.DependencyInjection;

namespace ElysianFunctions.Middleware
{
    public class MuliTenantFunctionsWorkerMiddleware : IFunctionsWorkerMiddleware
    {
        public async Task Invoke(FunctionContext context, FunctionExecutionDelegate next)
        {
            // determine the type, the default is Microsoft.Azure.Functions.Worker.Context.Features.GrpcFunctionBindingsFeature
            (Type featureType, object featureInstance) = context.Features.SingleOrDefault(x => x.Key.Name == "IFunctionBindingsFeature");

            // find the input binding of the function which has been invoked and then find the associated parameter of the function for the data we want
            var inputData = featureType.GetProperties().SingleOrDefault(p => p.Name == "InputData")?.GetValue(featureInstance) as IReadOnlyDictionary<string, object>;
            var requestData = inputData?.Values.SingleOrDefault(obj => obj is HttpRequestData) as HttpRequestData;

            context.InstanceServices.GetRequiredService<IMultiTenantContextAccessor>();
            var multiTenantContextSetter = context.InstanceServices.GetRequiredService<IMultiTenantContextSetter>();

            var value = (multiTenantContextSetter.MultiTenantContext = 
                await context.InstanceServices.GetRequiredService<ITenantResolver>().ResolveAsync(requestData)) ?? throw new NotFoundException();

            context.Items[typeof(IMultiTenantContext)] = value;
            await next(context);
        }
    }

    public class FunctionsWorkerHeaderStrategy(string headerKey) : IMultiTenantStrategy
    {
        public Task<string?> GetIdentifierAsync(object context)
        {
            if (context is not HttpRequestData httpRequestData)
            {
                throw new MultiTenantException(null,
                    new ArgumentException($"\"{nameof(context)}\" type must be of type HttpRequestData", nameof(context)));
            }

            if (!httpRequestData.Headers.TryGetValues(headerKey, out var values) || values?.Any() != true)
            {
                throw new MultiTenantException(null,
                    new ArgumentException($"\"{headerKey}\" header not found in HttpRequestData", nameof(context)));
            }

            return Task.FromResult(values.FirstOrDefault());
        }
    }
}
