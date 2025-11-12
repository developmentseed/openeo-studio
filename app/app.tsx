import { useState } from 'react';
import {
  Badge,
  Button,
  Container,
  Field,
  Flex,
  Heading,
  Input,
  Text,
  Textarea
} from '@chakra-ui/react';

const handDrawn = '255px 15px 225px 15px/15px 225px 15px 255px';

const indentLines = (str: string, spaces: number): string => {
  const indentation = ' '.repeat(spaces);
  return str
    .split('\n')
    .map((line) => indentation + line)
    .join('\n');
};

function generateCode(indicators, colormapping) {
  const indicatorCode = indicators.map(
    ({ id, variable, content }) =>
      `def fn_indicator_${id}():
${indentLines(content, 2)}
${variable} = fn_indicator_${id}()
`
  );

  return `${indicatorCode.join('\n')}

def fn_colormapping():
${indentLines(colormapping, 2)}
return fn_colormapping()
`;
}

export default function App() {
  const [indicators, setIndicators] = useState([
    { id: 1, variable: '', content: '' }
  ]);
  const [colormapping, setColormapping] = useState('');

  const addIndicator = (): void => {
    const nextId =
      indicators.length > 0 ? Math.max(...indicators.map((b) => b.id)) + 1 : 1;
    setIndicators([...indicators, { id: nextId, variable: '', content: '' }]);
  };

  const removeIndicator = (id: number): void => {
    setIndicators(indicators.filter((b) => b.id !== id));
  };

  const updateIndicator = (
    id: number,
    field: 'variable' | 'content',
    value: string
  ): void => {
    setIndicators(
      indicators.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  return (
    <Container maxW='6xl' py={12} display='flex' gap={8} flexDir='column'>
      <Flex alignItems='center' justifyContent='space-between'>
        <Heading size='2xl'>Band Math</Heading>
        <Button mt={4} colorPalette='blue' size='sm' onClick={addIndicator}>
          Add Indicator
        </Button>
      </Flex>
      <Flex flexDir='column' gap={8} mt={8}>
        {indicators.map((indicator) => (
          <BandMathIndicator
            key={indicator.id}
            id={indicator.id}
            variable={indicator.variable}
            content={indicator.content}
            onRemove={() => removeIndicator(indicator.id)}
            onChange={updateIndicator}
          />
        ))}
      </Flex>
      <ColorMapping
        variables={indicators.map((i) => i.variable)}
        colormapping={colormapping}
        onChange={setColormapping}
      />

      <Heading size='2xl'>Result</Heading>
      <pre>{generateCode(indicators, colormapping)}</pre>
    </Container>
  );
}

interface BandMathIndicatorProps {
  id: number;
  variable: string;
  content: string;
  onRemove: () => void;
  onChange: (id: number, field: 'variable' | 'content', value: string) => void;
}

function BandMathIndicator({
  id,
  variable,
  content,
  onRemove,
  onChange
}: BandMathIndicatorProps) {
  const lastLine = content.trim().split('\n').pop() || '';
  const error = lastLine.startsWith('return')
    ? ''
    : 'Error: Last line must start with "return"';

  return (
    <Flex flexDir='column'>
      <Flex align='center' gap={4}>
        <Heading size='md' flexGrow={1}>
          Indicator #{id}
        </Heading>
        <Field.Root required maxW='15rem'>
          <Field.Label>
            Exported Variable <Field.RequiredIndicator />
          </Field.Label>
          <Input
            size='sm'
            borderRadius={handDrawn}
            value={variable}
            onChange={(e) => onChange(id, 'variable', e.target.value)}
          />
        </Field.Root>
        <Button colorPalette='red' onClick={onRemove} size='sm' alignSelf='end' borderRadius={handDrawn}>
          Remove
        </Button>
      </Flex>
      <Field.Root invalid={!!error}>
        <Textarea
          minH='15rem'
          resize='vertical'
          value={content}
          onChange={(e) => onChange(id, 'content', e.target.value)}
          mt={2}
          fontFamily='monospace'
          borderRadius={handDrawn}
        />
        <Field.ErrorText>{error}</Field.ErrorText>
      </Field.Root>
    </Flex>
  );
}

interface ColorMappingProps {
  colormapping: string;
  onChange: (value: string) => void;
  variables: string[];
}

function ColorMapping({
  colormapping,
  onChange,
  variables
}: ColorMappingProps) {
  const lastLine = colormapping.trim().split('\n').pop() || '';
  const error = lastLine.startsWith('return')
    ? ''
    : 'Error: Last line must start with "return"';

  return (
    <Flex flexDir='column'>
      <Heading size='2xl'>Color Mapping</Heading>
      <Flex gap={4}>
        Available variables:
        <Flex gap={2}>
          {variables.map((v) => (
            <Badge key={v} colorPalette='orange' size='md'>
              {v}
            </Badge>
          ))}
        </Flex>
      </Flex>
      <Field.Root invalid={!!error}>
        <Textarea
          minH='15rem'
          resize='vertical'
          mt={2}
          fontFamily='monospace'
          borderRadius={handDrawn}
          value={colormapping}
          onChange={(e) => onChange(e.target.value)}
        />
        <Field.ErrorText>{error}</Field.ErrorText>
      </Field.Root>
    </Flex>
  );
}
