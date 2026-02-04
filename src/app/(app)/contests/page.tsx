import ContestsPage from "@/fe/contests/page/ContestsPage";
import { contestList } from "@/fe/contests/data/contests";

export default async function ContestsPageRoute() {
  return <ContestsPage initialContests={contestList} />;
}
