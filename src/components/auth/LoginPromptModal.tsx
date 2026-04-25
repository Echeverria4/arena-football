import { router } from "expo-router";
import { Modal, Pressable, Text, View } from "react-native";

import { PrimaryButton } from "@/components/ui/PrimaryButton";

export interface LoginPromptModalProps {
  visible: boolean;
  onClose: () => void;
  eyebrow?: string;
  title?: string;
  description?: string;
  redirectPath?: string;
}

export function LoginPromptModal({
  visible,
  onClose,
  eyebrow = "Acesso necessario",
  title = "Entrar para continuar",
  description = "Para continuar essa acao e preciso estar logado. Ao se cadastrar, o login fica salvo automaticamente e voce volta para onde estava.",
  redirectPath,
}: LoginPromptModalProps) {
  const routeParams = redirectPath ? { redirect: redirectPath } : undefined;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          backgroundColor: "rgba(4,8,18,0.72)",
        }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 480,
            borderRadius: 24,
            padding: 24,
            backgroundColor: "rgba(11,8,28,0.96)",
            borderWidth: 1,
            borderColor: "rgba(167,139,250,0.38)",
            shadowColor: "#8B5CF6",
            shadowOpacity: 0.45,
            shadowRadius: 32,
          }}
        >
          <View className="gap-4">
            <Text
              style={{
                color: "#C4B5FD",
                fontSize: 11,
                fontWeight: "900",
                letterSpacing: 1.8,
                textTransform: "uppercase",
              }}
            >
              {eyebrow}
            </Text>
            <Text style={{ color: "#E5E7EB", fontSize: 22, fontWeight: "900" }}>{title}</Text>
            <Text style={{ color: "#94A3B8", fontSize: 14, lineHeight: 22 }}>{description}</Text>
            <View className="gap-3">
              <PrimaryButton
                label="Se cadastrar"
                onPress={() => {
                  onClose();
                  router.push({ pathname: "/register", params: routeParams });
                }}
              />
              <PrimaryButton
                label="Ja tenho conta"
                variant="light"
                onPress={() => {
                  onClose();
                  router.push({ pathname: "/login", params: routeParams });
                }}
              />
              <PrimaryButton
                label="Continuar navegando"
                variant="secondary"
                onPress={onClose}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
