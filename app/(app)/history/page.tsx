import { getScanHistory } from "@/lib/api";
import { ScreenHeader } from "@/components/nyata/screen-header";
import { HistoryList } from "@/components/account/history-list";

export default async function HistoryPage() {
  const items = await getScanHistory();
  return (
    <div>
      <ScreenHeader eyebrow="Log · Rekod imbasan" title="Sejarah">
        Setiap produk yang anda imbas, tersimpan untuk rujukan.
      </ScreenHeader>
      <HistoryList items={items} />
    </div>
  );
}
