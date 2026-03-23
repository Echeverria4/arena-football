import { Screen } from "@/components/ui/Screen";
import { TitleGalleryView } from "@/components/trophies/TitleGalleryView";

export default function TitlesScreen() {
  return (
    <Screen scroll ambientDiamond className="px-6">
      <TitleGalleryView />
    </Screen>
  );
}
