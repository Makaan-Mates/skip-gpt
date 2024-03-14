import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
const FormSchema = z.object({
  page_id: z.string({
    required_error: "Please select a notion page",
  }),
});

// This function is a simplified placeholder. It only handles plain text conversion.
function convertMarkdownToNotion(markdownText: string): any[] {
  const notionBlocks: any[] = [];
  const lines = markdownText.split("\n");

  let inCodeBlock = false;
  let codeContent = [];
  let codeLanguage = "plain text";

  lines.forEach((line) => {
    if (line.startsWith("```") && !inCodeBlock) {
      inCodeBlock = true;
      codeContent = [];
      const languageMatch = line.match(/^```(\w+)?/);
      codeLanguage =
        languageMatch && languageMatch[1] ? languageMatch[1] : "plain text";
    } else if (line.startsWith("```") && inCodeBlock) {
      inCodeBlock = false;
      notionBlocks.push({
        object: "block",
        type: "code",
        code: {
          rich_text: [
            { type: "text", text: { content: codeContent.join("\n") } },
          ],
          language: codeLanguage,
        },
      });
      codeContent = [];
    } else if (inCodeBlock) {
      codeContent.push(line);
    } else if (line.startsWith("# ")) {
      notionBlocks.push({
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: [{ type: "text", text: { content: line.slice(2) } }],
        },
      });
    } else if (line.startsWith("## ")) {
      notionBlocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: line.slice(3) } }],
        },
      });
    } else if (line.startsWith("### ")) {
      notionBlocks.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: line.slice(4) } }],
        },
      });
    } else if (line.startsWith("- ")) {
      notionBlocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: line.slice(2) } }],
        },
      });
    } else if (line.trim() !== "") {
      notionBlocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: line } }],
        },
      });
    }
  });

  return notionBlocks;
}

function SelectComponent({
  fluxTitle,
  fluxDescription,
  onRequestClose,
}: {
  fluxTitle: string;
  fluxDescription: string;
  onRequestClose: () => void;
}) {
  const [notionPages, setNotionPages] = useState([]);
  const { user } = useAuth0();
  const email = user?.email;
  const access_token = localStorage.getItem("accessToken");
  useEffect(() => {
    const fetchNotionPages = async () => {
      const response = await axios.post(
        "http://localhost:4000/api/fetchpages",
        { access_token: access_token }
      );
      console.log(response.data.data);
      setNotionPages(response.data.data);
    };
    fetchNotionPages();
  }, []);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log(data);

    const notionFormattedContent = convertMarkdownToNotion(fluxDescription);

    const pageCreationResponse = await axios.post(
      "http://localhost:4000/api/create/notionpage",
      {
        page_id: data.page_id,
        email: email,
        access_token: access_token,
        title: fluxTitle,
      }
    );

    console.log(pageCreationResponse.data);
    const createdPageId = pageCreationResponse.data.data;
    console.log(`Created page id: ${createdPageId}`);

    const appendContentResponse = await axios.post(
      "http://localhost:4000/api/appendcontent",
      {
        page_id: createdPageId,
        email: email,
        content: notionFormattedContent,
        access_token: access_token,
      }
    );
    console.log(appendContentResponse.data);
    onRequestClose();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-2/3 space-y-6 bg-[#1C2839] p-2 rounded-lg"
      >
        <FormField
          control={form.control}
          name="page_id"
          render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the notion page " />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {notionPages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page?.properties?.title?.title[0]?.plain_text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
        <Button
          onClick={() => {
            onRequestClose();
          }}
          className="bg-[#2A3647] hover:bg-purple-700 my-2 mx-2 px-4 rounded-md py-2"
        >
          Close
        </Button>
      </form>
    </Form>
  );
}

export default SelectComponent;
