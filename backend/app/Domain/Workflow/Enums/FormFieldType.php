<?php

namespace App\Domain\Workflow\Enums;

enum FormFieldType: string
{
    case Text = 'text';
    case Number = 'number';
    case Select = 'select';
    case Date = 'date';
    case Textarea = 'textarea';
    case Boolean = 'bool';
}
