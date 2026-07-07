import { BaseApi } from "./baseApi";

class StatisticsApi extends BaseApi {
  constructor() {
    super({
      defaultErrorMessage: "Statistiken konnten nicht geladen werden.",
    });
  }

    async getStatistics(accessToken) {
    return this.request("/order/statistics", {
        accessToken,
    });
}

}


const statisticsApi = new StatisticsApi();

export { StatisticsApi };
export default statisticsApi;