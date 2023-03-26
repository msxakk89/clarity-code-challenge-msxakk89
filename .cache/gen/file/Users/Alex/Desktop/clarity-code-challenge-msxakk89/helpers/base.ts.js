import { Tx } from 'https://deno.land/x/clarinet@v1.0.6/index.ts';
export function readOnlyCall(chain, sender, contract, readOnlyFn, _arguments = []) {
    return chain.callReadOnlyFn(contract, readOnlyFn, _arguments, sender);
}
export function transactionCall(sender, contract, fn, _arguments = []) {
    return Tx.contractCall(contract, fn, _arguments, sender);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvQWxleC9EZXNrdG9wL2NsYXJpdHktY29kZS1jaGFsbGVuZ2UtbXN4YWtrODkvaGVscGVycy9iYXNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENoYWluLCBUeH0gZnJvbSAnaHR0cHM6Ly9kZW5vLmxhbmQveC9jbGFyaW5ldEB2MS4wLjYvaW5kZXgudHMnO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVhZE9ubHlDYWxsKGNoYWluOiBDaGFpbiwgc2VuZGVyOiBzdHJpbmcsIGNvbnRyYWN0OiBzdHJpbmcsIHJlYWRPbmx5Rm46IHN0cmluZywgX2FyZ3VtZW50czogQXJyYXk8YW55PiA9IFtdKSB7XG4gICAgcmV0dXJuIGNoYWluLmNhbGxSZWFkT25seUZuKGNvbnRyYWN0LCByZWFkT25seUZuLCBfYXJndW1lbnRzLCBzZW5kZXIpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2FjdGlvbkNhbGwoc2VuZGVyOiBzdHJpbmcsIGNvbnRyYWN0OiBzdHJpbmcsIGZuOiBzdHJpbmcsIF9hcmd1bWVudHM6IEFycmF5PGFueT4gPSBbXSkge1xuICAgIHJldHVybiBUeC5jb250cmFjdENhbGwoY29udHJhY3QsIGZuLCBfYXJndW1lbnRzLCBzZW5kZXIpXG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBZ0IsRUFBRSxRQUFPLDhDQUE4QyxDQUFDO0FBRXhFLE9BQU8sU0FBUyxZQUFZLENBQUMsS0FBWSxFQUFFLE1BQWMsRUFBRSxRQUFnQixFQUFFLFVBQWtCLEVBQUUsVUFBc0IsR0FBRyxFQUFFLEVBQUU7SUFDMUgsT0FBTyxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFBO0NBQ3hFO0FBRUQsT0FBTyxTQUFTLGVBQWUsQ0FBQyxNQUFjLEVBQUUsUUFBZ0IsRUFBRSxFQUFVLEVBQUUsVUFBc0IsR0FBRyxFQUFFLEVBQUU7SUFDdkcsT0FBTyxFQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFBO0NBQzNEIn0=