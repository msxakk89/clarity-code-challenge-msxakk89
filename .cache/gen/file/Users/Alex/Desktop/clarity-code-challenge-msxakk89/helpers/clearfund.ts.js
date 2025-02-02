import { types } from 'https://deno.land/x/clarinet@v1.0.6/index.ts';
import { readOnlyCall, transactionCall } from './base.ts';
const launchData = {
    title: types.utf8("ClearFund Campaign"),
    description: types.buff("Crowdfunding"),
    link: types.utf8("https://launch.campaign"),
    fundGoal: types.uint(20000),
    startsAt: types.uint(10),
    endsAt: types.uint(50)
};
let launchArguments = [
    launchData.title,
    launchData.description,
    launchData.link,
    launchData.fundGoal,
    launchData.startsAt,
    launchData.endsAt
];
const pledgeData = {
    campaignId: types.uint(1),
    amount: types.uint(1000)
};
const unpledgeData = {
    campaignId: types.uint(1),
    amount: types.uint(500)
};
// launch functions
export function launch(sender) {
    return transactionCall(sender, "clearfund", "launch", launchArguments);
}
// pledge functions
export function pledge(sender) {
    return transactionCall(sender, "clearfund", "pledge", [
        pledgeData.campaignId,
        pledgeData.amount
    ]);
}
export function pledgeAmountEmpty(sender) {
    return transactionCall(sender, "clearfund", "pledge", [
        pledgeData.campaignId,
        types.uint(0)
    ]);
}
export function pledgeAmountLessThan500(sender) {
    return transactionCall(sender, "clearfund", "pledge", [
        pledgeData.campaignId,
        types.uint(499)
    ]);
}
export function pledgeAmountGreaterThanGoal(sender) {
    return transactionCall(sender, "clearfund", "pledge", [
        pledgeData.campaignId,
        types.uint(20000)
    ]);
}
// unpledge functions
export function unpledge(sender) {
    return transactionCall(sender, "clearfund", "unpledge", [
        unpledgeData.campaignId,
        unpledgeData.amount
    ]);
}
export function unpledgeAll(sender) {
    return transactionCall(sender, "clearfund", "unpledge", [
        unpledgeData.campaignId,
        pledgeData.amount
    ]);
}
export function unpledgeMoreThanPledged(sender) {
    return transactionCall(sender, "clearfund", "unpledge", [
        unpledgeData.campaignId,
        types.uint(1200)
    ]);
}
// refund functions
export function refund(sender) {
    return transactionCall(sender, "clearfund", "refund", [
        unpledgeData.campaignId
    ]);
}
// read-only functions
export function getCampaign(chain, sender) {
    return readOnlyCall(chain, sender, "clearfund", "get-campaign", [
        pledgeData.campaignId
    ]);
}
export function getInvestment(chain, sender) {
    return readOnlyCall(chain, sender, "clearfund", "get-investment", [
        pledgeData.campaignId,
        types.principal(sender)
    ]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvQWxleC9EZXNrdG9wL2NsYXJpdHktY29kZS1jaGFsbGVuZ2UtbXN4YWtrODkvaGVscGVycy9jbGVhcmZ1bmQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2hhaW4sIHR5cGVzIH0gZnJvbSAnaHR0cHM6Ly9kZW5vLmxhbmQveC9jbGFyaW5ldEB2MS4wLjYvaW5kZXgudHMnO1xuaW1wb3J0IHsgcmVhZE9ubHlDYWxsLCB0cmFuc2FjdGlvbkNhbGwgfSBmcm9tICcuL2Jhc2UudHMnXG5cbmNvbnN0IGxhdW5jaERhdGEgPSB7XG4gICAgdGl0bGU6IHR5cGVzLnV0ZjgoXCJDbGVhckZ1bmQgQ2FtcGFpZ25cIiksXG4gICAgZGVzY3JpcHRpb246IHR5cGVzLmJ1ZmYoXCJDcm93ZGZ1bmRpbmdcIiksXG4gICAgbGluazogdHlwZXMudXRmOChcImh0dHBzOi8vbGF1bmNoLmNhbXBhaWduXCIpLFxuICAgIGZ1bmRHb2FsOiB0eXBlcy51aW50KDIwMDAwKSxcbiAgICBzdGFydHNBdDogdHlwZXMudWludCgxMCksXG4gICAgZW5kc0F0OiB0eXBlcy51aW50KDUwKVxufVxuXG5sZXQgbGF1bmNoQXJndW1lbnRzID0gW1xuICAgIGxhdW5jaERhdGEudGl0bGUsXG4gICAgbGF1bmNoRGF0YS5kZXNjcmlwdGlvbixcbiAgICBsYXVuY2hEYXRhLmxpbmssXG4gICAgbGF1bmNoRGF0YS5mdW5kR29hbCxcbiAgICBsYXVuY2hEYXRhLnN0YXJ0c0F0LFxuICAgIGxhdW5jaERhdGEuZW5kc0F0XG5dXG5cbmNvbnN0IHBsZWRnZURhdGEgPSB7XG4gICAgY2FtcGFpZ25JZDogdHlwZXMudWludCgxKSxcbiAgICBhbW91bnQ6IHR5cGVzLnVpbnQoMTAwMClcbn1cblxuY29uc3QgdW5wbGVkZ2VEYXRhID0ge1xuICAgIGNhbXBhaWduSWQ6IHR5cGVzLnVpbnQoMSksXG4gICAgYW1vdW50OiB0eXBlcy51aW50KDUwMClcbn1cblxuLy8gbGF1bmNoIGZ1bmN0aW9uc1xuZXhwb3J0IGZ1bmN0aW9uIGxhdW5jaChzZW5kZXI6IHN0cmluZykge1xuICAgIHJldHVybiB0cmFuc2FjdGlvbkNhbGwoc2VuZGVyLCBcImNsZWFyZnVuZFwiLCBcImxhdW5jaFwiLCBsYXVuY2hBcmd1bWVudHMpXG59XG5cbi8vIHBsZWRnZSBmdW5jdGlvbnNcbmV4cG9ydCBmdW5jdGlvbiBwbGVkZ2Uoc2VuZGVyOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdHJhbnNhY3Rpb25DYWxsKHNlbmRlciwgXCJjbGVhcmZ1bmRcIiwgXCJwbGVkZ2VcIiwgW3BsZWRnZURhdGEuY2FtcGFpZ25JZCwgcGxlZGdlRGF0YS5hbW91bnRdKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGxlZGdlQW1vdW50RW1wdHkoc2VuZGVyOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdHJhbnNhY3Rpb25DYWxsKHNlbmRlciwgXCJjbGVhcmZ1bmRcIiwgXCJwbGVkZ2VcIiwgW3BsZWRnZURhdGEuY2FtcGFpZ25JZCwgdHlwZXMudWludCgwKV0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwbGVkZ2VBbW91bnRMZXNzVGhhbjUwMChzZW5kZXI6IHN0cmluZykge1xuICAgIHJldHVybiB0cmFuc2FjdGlvbkNhbGwoc2VuZGVyLCBcImNsZWFyZnVuZFwiLCBcInBsZWRnZVwiLCBbcGxlZGdlRGF0YS5jYW1wYWlnbklkLCB0eXBlcy51aW50KDQ5OSldKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGxlZGdlQW1vdW50R3JlYXRlclRoYW5Hb2FsKHNlbmRlcjogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRyYW5zYWN0aW9uQ2FsbChzZW5kZXIsIFwiY2xlYXJmdW5kXCIsIFwicGxlZGdlXCIsIFtwbGVkZ2VEYXRhLmNhbXBhaWduSWQsIHR5cGVzLnVpbnQoMjAwMDApXSlcbn1cblxuLy8gdW5wbGVkZ2UgZnVuY3Rpb25zXG5leHBvcnQgZnVuY3Rpb24gdW5wbGVkZ2Uoc2VuZGVyOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdHJhbnNhY3Rpb25DYWxsKHNlbmRlciwgXCJjbGVhcmZ1bmRcIiwgXCJ1bnBsZWRnZVwiLCBbdW5wbGVkZ2VEYXRhLmNhbXBhaWduSWQsIHVucGxlZGdlRGF0YS5hbW91bnRdKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5wbGVkZ2VBbGwoc2VuZGVyOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdHJhbnNhY3Rpb25DYWxsKHNlbmRlciwgXCJjbGVhcmZ1bmRcIiwgXCJ1bnBsZWRnZVwiLCBbdW5wbGVkZ2VEYXRhLmNhbXBhaWduSWQsIHBsZWRnZURhdGEuYW1vdW50XSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVucGxlZGdlTW9yZVRoYW5QbGVkZ2VkKHNlbmRlcjogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRyYW5zYWN0aW9uQ2FsbChzZW5kZXIsIFwiY2xlYXJmdW5kXCIsIFwidW5wbGVkZ2VcIiwgW3VucGxlZGdlRGF0YS5jYW1wYWlnbklkLCB0eXBlcy51aW50KDEyMDApXSlcbn1cblxuLy8gcmVmdW5kIGZ1bmN0aW9uc1xuZXhwb3J0IGZ1bmN0aW9uIHJlZnVuZChzZW5kZXI6IHN0cmluZykge1xuICAgIHJldHVybiB0cmFuc2FjdGlvbkNhbGwoc2VuZGVyLCBcImNsZWFyZnVuZFwiLCBcInJlZnVuZFwiLCBbdW5wbGVkZ2VEYXRhLmNhbXBhaWduSWRdKVxufVxuXG4vLyByZWFkLW9ubHkgZnVuY3Rpb25zXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2FtcGFpZ24oY2hhaW46IENoYWluLCBzZW5kZXI6IHN0cmluZykge1xuICAgIHJldHVybiByZWFkT25seUNhbGwoY2hhaW4sIHNlbmRlciwgXCJjbGVhcmZ1bmRcIiwgXCJnZXQtY2FtcGFpZ25cIiwgW3BsZWRnZURhdGEuY2FtcGFpZ25JZF0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbnZlc3RtZW50KGNoYWluOiBDaGFpbiwgc2VuZGVyOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gcmVhZE9ubHlDYWxsKGNoYWluLCBzZW5kZXIsIFwiY2xlYXJmdW5kXCIsIFwiZ2V0LWludmVzdG1lbnRcIiwgW3BsZWRnZURhdGEuY2FtcGFpZ25JZCwgdHlwZXMucHJpbmNpcGFsKHNlbmRlcildKVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQWdCLEtBQUssUUFBUSw4Q0FBOEMsQ0FBQztBQUM1RSxTQUFTLFlBQVksRUFBRSxlQUFlLFFBQVEsV0FBVyxDQUFBO0FBRXpELE1BQU0sVUFBVSxHQUFHO0lBQ2YsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUM7SUFDdkMsV0FBVyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDO0lBQ3ZDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDO0lBQzNDLFFBQVEsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUMzQixRQUFRLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7SUFDeEIsTUFBTSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0NBQ3pCO0FBRUQsSUFBSSxlQUFlLEdBQUc7SUFDbEIsVUFBVSxDQUFDLEtBQUs7SUFDaEIsVUFBVSxDQUFDLFdBQVc7SUFDdEIsVUFBVSxDQUFDLElBQUk7SUFDZixVQUFVLENBQUMsUUFBUTtJQUNuQixVQUFVLENBQUMsUUFBUTtJQUNuQixVQUFVLENBQUMsTUFBTTtDQUNwQjtBQUVELE1BQU0sVUFBVSxHQUFHO0lBQ2YsVUFBVSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3pCLE1BQU0sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztDQUMzQjtBQUVELE1BQU0sWUFBWSxHQUFHO0lBQ2pCLFVBQVUsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN6QixNQUFNLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7Q0FDMUI7QUFFRCxtQkFBbUI7QUFDbkIsT0FBTyxTQUFTLE1B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