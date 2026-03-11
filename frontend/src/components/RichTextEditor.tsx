import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

const modules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['blockquote', 'code-block'],
        [{ align: [] }],
        ['link'],
        ['clean'],
    ],
};

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list',
    'indent',
    'blockquote', 'code-block',
    'align',
    'link',
];

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
    return (
        <div className="quill-wrapper">
            <ReactQuill
                theme="snow"
                value={content}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder || 'Escreva suas anotações detalhadas aqui...'}
            />
        </div>
    );
}
