import React from 'react';
    import { render, screen, fireEvent } from '@testing-library/react';
    import FileUpload from '../FileUpload';
    import axios from 'axios';

    jest.mock('axios');

    describe('FileUpload', () => {
      it('should render and handle file upload', async () => {
        axios.post.mockResolvedValue({ data: { message: 'File uploaded, analysis started' } });
        render(<FileUpload />);
        fireEvent.change(screen.getByLabelText(/select/i), { target: { value: 'advertising' } });
        fireEvent.change(screen.getByLabelText(/file/i), { target: { files: [new File([''], 'test.csv')] } });
        fireEvent.click(screen.getByText(/Upload/i));
        expect(axios.post).toHaveBeenCalled();
      });
    });