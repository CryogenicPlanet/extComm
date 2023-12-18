import { CommSchema, createComm } from ".";

type RecordingStatus = "recording" | "paused" | "stopped";
type RecorderEvent = {
  _dummy: string;
};
type Session = {
  _dummy: string;
};
type JSONSerializedRenderNode = {
  _dummy: string;
};

type Schema = CommSchema<{
  content: {
    startRecording: () => void;
    stopRecording: () => void;
  };
  background: {
    log: (level: "debug" | "warn" | "error", jsonString: string) => void;
    getRecordingState: () => {
      isRecording: boolean;
      status: RecordingStatus;
    };
    setRecordingState: (isRecording: boolean) => Promise<void>;
    addEvent: (
      event: RecorderEvent,
      dom: JSONSerializedRenderNode | null
    ) => void;
    getSession: () => Session | null;
  };
  popup: {
    _noop: () => void;
  };
}>;

const extComm = createComm<Schema>();

extComm.onMsg("content", "startRecording", () => {});

extComm.onMsgCallback("background", "getRecordingState", (_msg, cb) => {
  cb({
    isRecording: true,
    status: "recording",
  });

  return true;
});
