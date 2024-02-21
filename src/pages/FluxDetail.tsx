import { useEffect, useState } from "react";
import { useRecoilValueLoadable } from "recoil";
import { notesAtom } from "../atoms/atoms";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";

const FluxDetail = () => {
  const { videoId = "" } = useParams();
  const notesLoadable = useRecoilValueLoadable(notesAtom(videoId));
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (notesLoadable.state === "hasValue") {
      setNotes(notesLoadable.contents);
    }
  }, [notesLoadable]);


  let title = "";
  let descriptionLines:string[] = [];

  if (notes) {
    title = notes.split("Description:")[0].split("Title:")[1];
    const description = notes.split("Description:")[1];

    // Split the description into separate lines
    if (description) {
      descriptionLines = description.split('\n');
    }
  }

  return (
    <>
      {notesLoadable.state === "loading" ? (
        <div className="flex w-full flex-col items-center">
          <div className="w-full">
            <Box sx={{ width: "100%" }}>
              <LinearProgress
              // sx={{
              //   backgroundColor: "#a3adbe",
              //   "& .MuiLinearProgress-bar": {
              //     backgroundColor: "#1C2839",
              //   },
              // }}
              />
            </Box>
          </div>
        </div>
      ) : (
        <div>
          <div className="font-bold text-2xl">{title}</div>
          <ul>
            {descriptionLines.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default FluxDetail;
