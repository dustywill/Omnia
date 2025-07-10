import React from 'react';
import { Card } from '../../src/ui/components/Card/Card.js';
import { Button } from '../../src/ui/components/Button/Button.js';

const SimpleScriptRunnerPlugin: React.FC = () => {
  return (
    <Card>
      <h2>Simple Script Runner</h2>
      <p>This is a test to isolate the React error #130.</p>
      <Button variant="primary">Test Button</Button>
    </Card>
  );
};

export default SimpleScriptRunnerPlugin;